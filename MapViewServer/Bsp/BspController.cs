using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using ImageMagick;
using MimeTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix( "/bsp" )]
    public partial class BspController : ResourceController
    {
        protected override string FilePath => "maps/" + Request.Url.AbsolutePath.Split( '/' ).Skip( 2 ).FirstOrDefault();

        private static string GetMapPath( string mapName )
        {
            if ( !mapName.EndsWith( ".bsp" ) ) mapName = $"{mapName}.bsp";

            return Path.Combine( Program.CsgoDirectory, "maps", mapName );
        }

        private static readonly Dictionary<string, ValveBspFile> _sBspCache =
            new Dictionary<string, ValveBspFile>( StringComparer.InvariantCultureIgnoreCase );

        public static ValveBspFile GetBspFile( HttpListenerRequest request, string mapName )
        {
            lock ( _sBspCache )
            {
                ValveBspFile bsp;
                if ( _sBspCache.TryGetValue( mapName, out bsp ) ) return bsp;

                var path = GetMapPath( mapName );
                if ( !File.Exists( path ) )
                    throw new ControllerActionException( request, true, HttpStatusCode.NotFound,
                        "The requested resource was not found." );

                bsp = new ValveBspFile( path, mapName );
                _sBspCache.Add( mapName, bsp );

                return bsp;
            }
        }

        private static JToken SerializeBspChild( ValveBspFile bsp, BspChild child )
        {
            return child.IsLeaf ? SerializeBspLeaf( bsp, child.Index ) : SerializeBspNode( bsp, child.Index );
        }

        private static JToken SerializeBspNode( ValveBspFile bsp, int index )
        {
            var node = bsp.Nodes[index];
            var plane = bsp.Planes[node.PlaneNum];

            return new JObject
            {
                {"plane", plane.ToJson()},
                {"min", node.Min.ToJson()},
                {"max", node.Max.ToJson()},
                {
                    "children", new JArray
                    {
                        SerializeBspChild( bsp, node.ChildA ),
                        SerializeBspChild( bsp, node.ChildB )
                    }
                }
            };
        }

        public static JToken SerializeBspLeaf( ValveBspFile bsp, int index )
        {
            var leaf = bsp.Leaves[index];

            var response = new JObject
            {
                {"index", index},
                {"min", leaf.Min.ToJson()},
                {"max", leaf.Max.ToJson()},
                {"area", leaf.AreaFlags.Area},
                {"flags", (int) leaf.AreaFlags.Flags },
                {"hasFaces", leaf.NumLeafFaces > 0}
            };

            if ( leaf.Cluster != -1 )
            {
                response.Add( "cluster", leaf.Cluster );
            }

            return response;
        }

        private bool CheckNotExpired( string mapName )
        {
            var path = GetMapPath( mapName );
            var mapInfo = new FileInfo( path );
            var lastModified = mapInfo.LastWriteTimeUtc;

            Response.Headers.Add( "Cache-Control", "public, max-age=31556736" );
            Response.Headers.Add( "Last-Modified", lastModified.ToString( "R" ) );

            var header = Request.Headers["If-Modified-Since"];
            DateTime result;
            if ( header != null &&
                 DateTime.TryParseExact( header, "R", CultureInfo.InvariantCulture.DateTimeFormat,
                     DateTimeStyles.AdjustToUniversal, out result ) && result < lastModified )
            {
                Response.StatusCode = 304;
                Response.OutputStream.Close();
                return true;
            }

            return false;
        }

        [ThreadStatic]
        private static List<BspTree.Leaf> _sLeafBuffer;

        private static JArray GetIntersectingClusters( BspTree tree, Vector3 min, Vector3 max )
        {
            if ( _sLeafBuffer == null ) _sLeafBuffer = new List<BspTree.Leaf>();
            else _sLeafBuffer.Clear();

            tree.GetIntersectingLeaves( min, max, _sLeafBuffer );

            var clusters = new JArray();

            foreach ( var cluster in _sLeafBuffer.Select( x => x.Info.Cluster ).Distinct() )
            {
                clusters.Add( cluster );
            }

            return clusters;
        }

        [Get( "/{mapName}/model" )]
        public JToken GetModels( [Url] string mapName, int index )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var response = new JObject();
            
            var bsp = GetBspFile( Request, mapName );
            var model = bsp.Models[index];
            var tree = SerializeBspNode( bsp, model.HeadNode );

            response.Add( "index", index );
            response.Add( "min", model.Min.ToJson() );
            response.Add( "max", model.Max.ToJson() );
            response.Add( "origin", model.Origin.ToJson() );
            response.Add( "tree", Compressed ? LZString.compressToBase64( tree.ToString( Formatting.None ) ) : tree );

            return response;
        }

        private static void AddToBounds( ref Vector3 min, ref Vector3 max, Vector3 pos )
        {
            if ( pos.X < min.X ) min.X = pos.X;
            if ( pos.Y < min.Y ) min.Y = pos.Y;
            if ( pos.Z < min.Z ) min.Z = pos.Z;

            if ( pos.X > max.X ) max.X = pos.X;
            if ( pos.Y > max.Y ) max.Y = pos.Y;
            if ( pos.Z > max.Z ) max.Z = pos.Z;
        }

        private static void GetDisplacementBounds( ValveBspFile bsp, int index,
            out Vector3 min, out Vector3 max, float bias = 0f )
        {
            min = new Vector3( float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity );
            max = new Vector3( float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity );

            var disp = bsp.DisplacementManager[index];
            var biasVec = disp.Normal * bias;

            for ( var y = 0; y < disp.Size; ++y )
            for ( var x = 0; x < disp.Size; ++x )
            {
                var pos = disp.GetPosition( x, y );

                AddToBounds( ref min, ref max, pos - biasVec );
                AddToBounds( ref min, ref max, pos + biasVec );
            }
        }

        [Get( "/{mapName}/displacements" )]
        public JToken GetDisplacements( [Url] string mapName )
        {
            var bsp = GetBspFile( Request, mapName );
            var tree = new BspTree( bsp, 0 );
            var displacements = new JArray();

            foreach ( var dispInfo in bsp.DisplacementInfos )
            {
                var face = bsp.FacesHdr[dispInfo.MapFace];

                Vector3 min, max;
                GetDisplacementBounds( bsp, face.DispInfo, out min, out max, 1f );

                displacements.Add( new JObject
                {
                    {"index", face.DispInfo},
                    {"power", dispInfo.Power},
                    {"min", min.ToJson()},
                    {"max", max.ToJson()},
                    {"clusters", GetIntersectingClusters( tree, min, max )}
                } );
            }

            return new JObject
            {
                {"displacements", displacements}
            };
        }

        [Get( "/{mapName}/lightmap" )]
        public void GetLightmap( [Url] string mapName )
        {
            Response.ContentType = MimeTypeMap.GetMimeType( ".png" );

            if ( CheckNotExpired( mapName ) ) return;
            
            var bsp = GetBspFile( Request, mapName );

            using ( var sampleStream = bsp.GetLumpStream( ValveBspFile.LumpType.LIGHTING_HDR ) )
            {
                var lightmap = bsp.LightmapLayout;
                var width = lightmap.TextureSize.X;
                var height = lightmap.TextureSize.Y;

                var pixels = new byte[width * height * 4];

                var sampleBuffer = new LightmapSample[256 * 256];

                for ( int i = 0, iEnd = bsp.FacesHdr.Length; i < iEnd; ++i )
                {
                    var face = bsp.FacesHdr[i];
                    if ( face.LightOffset == -1 ) continue;

                    var rect = lightmap.GetLightmapRegion( i );
                    var sampleCount = rect.Width * rect.Height;

                    sampleStream.Seek( face.LightOffset, SeekOrigin.Begin );

                    LumpReader<LightmapSample>.ReadLumpFromStream( sampleStream, sampleCount, sampleBuffer );

                    for ( var y = -1; y < rect.Height + 1; ++y )
                    for ( var x = -1; x < rect.Width + 1; ++x )
                    {
                        var s = Math.Max( 0, Math.Min( x, rect.Width - 1 ) );
                        var t = Math.Max( 0, Math.Min( y, rect.Height - 1 ) );

                        var index = (rect.X + x + width * (rect.Y + y)) * 4;
                        var sampleIndex = s + t * rect.Width;
                        var sample = sampleBuffer[sampleIndex];
                            
                        pixels[index + 0] = sample.B;
                        pixels[index + 1] = sample.G;
                        pixels[index + 2] = sample.R;
                        pixels[index + 3] = (byte) (sample.Exponent + 128);
                    }
                }

                Utils.ImageMagickConvert( pixels, Response.OutputStream, MagickFormat.Bgra, width, height, MagickFormat.Png );
                Response.OutputStream.Close();
            }
        }

        [Get( "/{mapName}/visibility" )]
        public JToken GetVisibility( [Url] string mapName, int index )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var bsp = GetBspFile( Request, mapName );

            return new JObject
            {
                {"index", index},
                { "pvs", SerializeArray( bsp.Visibility[index] )}
            };
        }

        [Get( "/{mapName}/cubemaps" )]
        public JToken GetCubemaps( [Url] string mapName )
        {
            if ( CheckNotExpired( mapName ) ) return null;
            
            var bsp = GetBspFile( Request, mapName );

            var array = new JArray();

            foreach ( var cubemap in bsp.Cubemaps )
            {
                var fileName = $"materials/maps/{mapName}/c{cubemap.OriginX}_{cubemap.OriginY}_{cubemap.OriginZ}.vtf";
                array.Add( new JObject
                {
                    {"origin", new Vector3( cubemap.OriginX, cubemap.OriginY, cubemap.OriginZ ).ToJson()},
                    {"vtfUrl", VtfController.GetUrl( Request, fileName, mapName )}
                } );
            }

            return new JObject
            {
                { "cubemaps", array }
            };
        }

        [Get("/{mapName}/entity-test")]
        public JToken GetEntityTest( [Url] string mapName )
        {
            var response = new JArray();
            
            var bsp = GetBspFile( Request, mapName );

            foreach ( var ent in bsp.Entities )
            {
                var obj = new JObject();

                foreach ( var propName in ent.PropertyNames )
                {
                    obj.Add( propName, ent.GetRawPropertyValue( propName ) );
                }

                response.Add( obj );
            }

            return new JObject
            {
                {"entities", response}
            };
        }
    }
}

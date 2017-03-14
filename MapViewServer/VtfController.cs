using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using MimeTypes;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix( UrlPrefix )]
    public class VtfController : ResourceController
    {
        public const string UrlPrefix = "/vtf";

        public static string GetUrl( HttpListenerRequest request, string path, string mapName = null )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{GetProviderPrefix( mapName )}/{path}";
        }

        protected override string FilePath
        {
            get
            {
                var basePath = base.FilePath;
                var ext = Path.GetExtension( basePath );
                if ( ext.Equals( ".vtf", StringComparison.InvariantCultureIgnoreCase ) ) return basePath;
                if ( string.IsNullOrEmpty( ext ) ) return $"{basePath}.vtf";
                return $"{basePath.Substring( 0, basePath.LastIndexOf( '.' ) )}.vtf";
            }
        }

        private JObject GetJson( IResourceProvider provider, string filePath, string mapName = null )
        {
            ValveTextureFile vtf;

            using ( var vtfStream = provider.OpenFile( filePath ) )
            {
                vtf = new ValveTextureFile( vtfStream, true );
            }

            var response = new JObject
            {
                {"width", vtf.Header.Width},
                {"height", vtf.Header.Height},
                {"version", vtf.Header.MajorVersion + vtf.Header.MinorVersion * 0.1f },
                {"flags", (long) vtf.Header.Flags},
                {"pngUrl", GetPngUrl( Request, filePath, vtf, mapName )},
                {"mipmaps", vtf.MipmapCount},
                {"frames", vtf.FrameCount },
                {"faces", vtf.FaceCount },
                {"depth", vtf.ZSliceCount }
            };

            return response;
        }

        private void AppendToQueryString( StringBuilder queryStringBuilder, string key, int value = -1 )
        {
            var prefix = queryStringBuilder.Length == 0 ? "?" : "&";
            var valueStr = value == -1 ? $"{{{key}}}" : value.ToString();
            queryStringBuilder.Append( $"{prefix}{key}={valueStr}" );
        }

        private string GetPngUrl( HttpListenerRequest request, string path, ValveTextureFile vtf, string mapName = null )
        {
            var queryStringBuilder = new StringBuilder();

            if ( vtf.MipmapCount > 1 ) AppendToQueryString( queryStringBuilder, "mipmap" );
            if ( vtf.FrameCount > 1 ) AppendToQueryString( queryStringBuilder, "frame" );
            if ( vtf.FaceCount > 1 ) AppendToQueryString( queryStringBuilder, "face" );
            if ( vtf.ZSliceCount > 1 ) AppendToQueryString( queryStringBuilder, "zslice" );

            return $"http://{request.Url.Authority}{UrlPrefix}/{GetProviderPrefix( mapName )}/{path.Replace( ".vtf", ".png" )}{queryStringBuilder}";
        }

        [Get( "/vpk", MatchAllUrl = false )]
        public JObject GetJson()
        {
            return GetJson( Resources, FilePath );
        }

        [Get( "/pak/{mapName}", MatchAllUrl = false )]
        public JObject GetJson( [Url] string mapName )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            return GetJson( bsp.PakFile, FilePath, mapName );
        }

        private void GetPng( IResourceProvider provider, string filePath, int mipmap, int frame, int face, int zslice )
        {
            Response.ContentType = MimeTypeMap.GetMimeType( ".png" );

            VtfConverter.ConvertToPng( provider, filePath, mipmap, frame, face, zslice, Response.OutputStream );
            Response.OutputStream.Close();
        }

        [Get( "/vpk", MatchAllUrl = false, Extension = ".png" )]
        public void GetPng( int mipmap = 0, int frame = -1, int face = -1, int zslice = 0)
        {
            GetPng( Resources, FilePath, mipmap, frame, face, zslice );
        }
        
        [Get( "/pak/{mapName}", MatchAllUrl = false, Extension = ".png" )]
        public void GetPng( [Url] string mapName, int mipmap = 0, int frame = -1, int face = -1, int zslice = 0 )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            GetPng( bsp.PakFile, FilePath, mipmap, frame, face, zslice );
        }
    }
}
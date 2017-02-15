using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
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

        private const string DefaultFormat = "json";

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

        private static string GetProviderPrefix( string mapName = null )
        {
            return mapName == null ? "vpk" : $"pak/{mapName}";
        }

        public static string GetUrl( HttpListenerRequest request, string path, string mapName = null, bool flipY = false )
        {
            var flipYString = flipY ? "?flipy=true" : "";
            return $"http://{request.Url.Authority}{UrlPrefix}/{GetProviderPrefix( mapName )}/{path}{flipYString}";
        }

        public static string GetPngUrl( HttpListenerRequest request, string path, string mapName = null, int mipMap = -1, bool flipY = false )
        {
            var mipMapString = mipMap == -1 ? "{mipmap}" : mipMap.ToString();
            var flipYString = flipY ? "&flipy=true" : "";
            return
                $"http://{request.Url.Authority}{UrlPrefix}/{GetProviderPrefix( mapName )}/{path.Replace( ".vtf", ".png" )}?mipmap={mipMapString}{flipYString}";
        }

        private JObject GetJson( IResourceProvider provider, string filePath, bool flipY, string mapName = null )
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
                {"flags", (long) vtf.Header.Flags},
                {"pngUrl", GetPngUrl( Request, filePath, mapName, -1, flipY )},
                {"mipmaps", vtf.Header.MipMapCount}
            };

            return response;
        }

        [Get( "/vpk", MatchAllUrl = false )]
        public JObject GetJson( bool flipY = false )
        {
            return GetJson( Resources, FilePath, flipY );
        }

        [Get( "/pak/{mapName}", MatchAllUrl = false )]
        public JObject GetJson( [Url] string mapName, bool flipY = false )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            return GetJson( bsp.PakFile, FilePath, flipY, mapName );
        }

        private void GetPng( IResourceProvider provider, string filePath, int mipmap, bool flipY )
        {
            Response.ContentType = MimeTypeMap.GetMimeType( ".png" );

            VtfConverter.ConvertToPng( provider, filePath, mipmap, flipY, Response.OutputStream );
            Response.OutputStream.Close();
        }

        [Get( "/vpk", MatchAllUrl = false, Extension = ".png" )]
        public void GetPng( int mipmap = 0, bool flipY = false )
        {
            GetPng( Resources, FilePath, mipmap, flipY );
        }
        
        [Get( "/pak/{mapName}", MatchAllUrl = false, Extension = ".png" )]
        public void GetPng( [Url] string mapName, int mipmap = 0, bool flipY = false )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            GetPng( bsp.PakFile, FilePath, mipmap, flipY );
        }
    }
}
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using JetBrains.Annotations;
using MimeTypes;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    partial class Program
    {
        private static readonly Dictionary<string, string> StaticFiles =
            new Dictionary<string, string>( StringComparer.InvariantCultureIgnoreCase )
            {
                {"/js/facepunch.webgame.js", Properties.Resources.facepunch_webgame},
                {"/js/sourceutils.js", Properties.Resources.sourceutils},
                {"/styles/mapviewer.css", Properties.Resources.mapviewer}
            };

        class StaticController : Controller
        {
            protected override void OnServiceText( string text )
            {
                using ( var writer = new StreamWriter( Response.OutputStream ) )
                {
                    writer.Write( text );
                }
            }

            [Get( MatchAllUrl = false ), UsedImplicitly]
            public string GetFile()
            {
                var path = Request.Url.AbsolutePath;

                if ( BaseOptions.ResourcesDir != null )
                {
                    var filePath = Path.Combine(BaseOptions.ResourcesDir, path.Substring(1));

                    if (File.Exists(filePath))
                    {
                        Response.ContentType = MimeTypeMap.GetMimeType(Path.GetExtension(path));
                        return File.ReadAllText(filePath);
                    }
                }

                string value;
                if ( StaticFiles.TryGetValue( path, out value ) )
                {
                    Response.ContentType = MimeTypeMap.GetMimeType( Path.GetExtension( path ) );
                    return value;
                }

                Response.StatusCode = 404;
                return "File not found.";
            }
        }

        private static void AddStaticFileControllers( Server server )
        {
            server.Controllers.Add<StaticController>("/");
        }
    }
}

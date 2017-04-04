using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using ImageMagick;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    using OpenTK.Graphics.ES20;

    public class TextureParameters
    {
        [JsonProperty("wrapS")]
        public TextureWrapMode? WrapS { get; set; }

        [JsonProperty("wrapT")]
        public TextureWrapMode? WrapT { get; set; }

        [JsonProperty("filter")]
        public TextureMinFilter? Filter { get; set; }

        [JsonProperty("mipmap")]
        public bool? MipMap { get; set; }
    }

    public class TextureElement
    {
        [JsonProperty("level")]
        public int Level { get; set; }

        [JsonProperty("target")]
        public TextureTarget? Target { get; set; }

        [JsonProperty("url")]
        public Url? Url { get; set; }

        [JsonProperty("color")]
        public MaterialColor? Color { get; set; }
    }

    public class Texture
    {
        [JsonProperty("target")]
        public TextureTarget Target { get; set; }

        [JsonProperty("width")]
        public int Width { get; set; }

        [JsonProperty("height")]
        public int Height { get; set; }

        [JsonProperty("params")]
        public TextureParameters Params { get; } = new TextureParameters();

        [JsonProperty("elements")]
        public List<TextureElement> Elements { get; } = new List<TextureElement>();
    }

    [Prefix("/materials")]
    [Prefix("/maps/{map}/materials")]
    partial class TextureController : ResourceController
    {
        [Get( MatchAllUrl = false, Extension = ".vtf.json" )]
        public Texture GetInfo( [Url] string map )
        {
            var absolute = Request.Url.AbsolutePath;
            var path = absolute.Substring(absolute.IndexOf( "/materials" ) + 1 );

            path = path.Substring( 0, path.Length - ".json".Length );

            var bsp = map == null ? null : Program.GetMap( map );
            var res = bsp == null ? Program.Resources : bsp.PakFile;

            ValveTextureFile vtf;
            using ( var stream = res.OpenFile( path ) )
            {
                vtf = new ValveTextureFile( stream );
            }

            var isCube = vtf.FaceCount == 6;

            var tex = new Texture
            {
                Target = isCube ? TextureTarget.TextureCubeMap : TextureTarget.Texture2D,
                Width = vtf.Header.Width,
                Height = vtf.Header.Height,
                Params =
                {
                    Filter = (vtf.Header.Flags & TextureFlags.POINTSAMPLE) != 0
                        ? TextureMinFilter.Nearest
                        : TextureMinFilter.Linear,
                    MipMap = (vtf.Header.Flags & TextureFlags.NOMIP) == 0,
                    WrapS = (vtf.Header.Flags & TextureFlags.CLAMPS) != 0
                        ? TextureWrapMode.ClampToEdge
                        : TextureWrapMode.Repeat,
                    WrapT = (vtf.Header.Flags & TextureFlags.CLAMPT) != 0
                        ? TextureWrapMode.ClampToEdge
                        : TextureWrapMode.Repeat
                }
            };

            byte[] pixelBuf = null;

            for ( var mip = vtf.MipmapCount - 1; mip >= 0; --mip )
            {
                var isSinglePixel = Math.Max( tex.Width >> mip, 1 ) * Math.Max( tex.Height >> mip, 1 ) == 1;

                for ( var face = 0; face < vtf.FaceCount; ++face )
                {
                    var elem = new TextureElement
                    {
                        Level = mip
                    };

                    if ( isCube ) elem.Target = TextureTarget.TextureCubeMapPositiveX + face;
                    if ( isSinglePixel )
                    {
                        if ( pixelBuf == null ) pixelBuf = new byte[vtf.GetHiResPixelDataLength( mip )];

                        vtf.GetHiResPixelData( mip, 0, face, 0, pixelBuf );

                        using ( var img = DecodeImage( vtf, mip, 0, face, 0 ) )
                        {
                            var pixel = img.GetPixels()[0, 0];
                            switch ( pixel.Channels )
                            {
                                case 3:
                                    elem.Color = new MaterialColor( pixel[0], pixel[1], pixel[2] );
                                    break;
                                case 4:
                                    elem.Color = new MaterialColor( pixel[0], pixel[1], pixel[2], pixel[3] );
                                    break;
                                default:
                                    throw new NotImplementedException();
                            }
                        }
                    }
                    else
                    {
                        var fileName = $"{path}/mip{mip}";

                        if ( vtf.FaceCount > 1 )
                        {
                            fileName = $"{fileName}.face{face}";
                        }

                        fileName = $"{fileName}.png";

                        elem.Url = bsp != null ? $"/maps/{bsp.Name}/{fileName}" : $"/{fileName}";
                    }

                    tex.Elements.Add( elem );
                }
            }

            return tex;
        }

        private static readonly Regex _sFileNameRegex = new Regex( @"^((?<param>mip|face|frame)(?<value>[0-9]+)\.)*(?<format>png)$", RegexOptions.IgnoreCase | RegexOptions.Compiled );

        [Get(MatchAllUrl = false, Extension = ".png")]
        public void GetImage( [Url] string map )
        {
            var absolute = Request.Url.AbsolutePath;
            var pathStart = absolute.IndexOf( "/materials" ) + 1;
            var pathEnd = absolute.IndexOf( ".vtf", pathStart ) + ".vtf".Length;
            var path = absolute.Substring(pathStart, pathEnd - pathStart);

            var fileName = Path.GetFileName( absolute );
            var match = _sFileNameRegex.Match( fileName );

            if ( !match.Success ) throw NotFoundException();

            var mip = 0;
            var face = 0;
            var frame = 0;

            var index = 0;
            foreach ( Capture capture in match.Groups["param"].Captures )
            {
                var param = capture.Value.ToLower();
                var value = int.Parse( match.Groups["value"].Captures[index++].Value );

                switch (param)
                {
                    case "mip":
                        mip = value;
                        break;
                    case "face":
                        face = value;
                        break;
                    case "frame":
                        frame = value;
                        break;
                }
            }

            var bsp = map == null ? null : Program.GetMap(map);
            var res = bsp == null ? Program.Resources : bsp.PakFile;

            ValveTextureFile vtf;
            using (var stream = res.OpenFile(path))
            {
                vtf = new ValveTextureFile(stream);
            }

            var buffer = new byte[vtf.GetHiResPixelDataLength( mip )];
            vtf.GetHiResPixelData( mip, frame, face, 0, buffer );

            using ( var image = DecodeImage( vtf, mip, frame, face, 0 ) )
            {
                image.Write( Response.OutputStream, MagickFormat.Png );
            }

            Response.OutputStream.Close();
        }
    }
}

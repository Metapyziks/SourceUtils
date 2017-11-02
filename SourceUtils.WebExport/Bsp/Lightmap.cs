using System;
using System.IO;
using ImageMagick;
using MimeTypes;
using OpenTK.Graphics.ES20;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    [Prefix("/maps/{map}")]
    class LightmapController : ResourceController
    {
        [Get("/lightmap.json")]
        public Texture GetInfo( [Url] string map )
        {
            var bsp = Program.GetMap(map);

            return new Texture
            {
                Target = TextureTarget.Texture2D,
                Width = bsp.LightmapLayout.TextureSize.X,
                Height = bsp.LightmapLayout.TextureSize.Y,
                Params =
                {
                    WrapS = TextureWrapMode.ClampToEdge,
                    WrapT = TextureWrapMode.ClampToEdge,
                    Filter = TextureMinFilter.Nearest,
                    MipMap = false
                },
                Elements =
                {
                    new TextureElement
                    {
                        Level = 0,
                        Url = $"/maps/{map}/lightmap.png"
                    }
                }
            };
        }

        [Get("/lightmap.png")]
        public void Get( [Url] string map )
        {
            if ( Skip )
            {
                Response.Close();
                return;
            }

            Response.ContentType = MimeTypeMap.GetMimeType(".png");

            var bsp = Program.GetMap( map );

            var lightingLump = bsp.LightingHdr.Length > 0 ? bsp.LightingHdr.LumpType : bsp.Lighting.LumpType;
            using (var sampleStream = bsp.GetLumpStream(lightingLump))
            {
                var lightmap = bsp.LightmapLayout;
                var width = lightmap.TextureSize.X;
                var height = lightmap.TextureSize.Y;

                var pixels = new byte[width * height * 4];

                var sampleBuffer = new ColorRGBExp32[256 * 256];
                var faces = bsp.FacesHdr.Length > 0 ? bsp.FacesHdr : bsp.Faces;

                for (int i = 0, iEnd = faces.Length; i < iEnd; ++i)
                {
                    var face = faces[i];
                    if (face.LightOffset == -1) continue;

                    var rect = lightmap.GetLightmapRegion(i);
                    var sampleCount = rect.Width * rect.Height;

                    sampleStream.Seek(face.LightOffset, SeekOrigin.Begin);

                    LumpReader<ColorRGBExp32>.ReadLumpFromStream(sampleStream, sampleCount, sampleBuffer);

                    for (var y = 0; y < rect.Height; ++y)
                    for (var x = 0; x < rect.Width; ++x)
                    {
                        var s = Math.Max(0, Math.Min(x, rect.Width - 1));
                        var t = Math.Max(0, Math.Min(y, rect.Height - 1));

                        var index = (rect.X + x + width * (rect.Y + y)) * 4;
                        var sampleIndex = s + t * rect.Width;
                        var sample = sampleBuffer[sampleIndex];

                        pixels[index + 0] = sample.B;
                        pixels[index + 1] = sample.G;
                        pixels[index + 2] = sample.R;
                        pixels[index + 3] = (byte)(sample.Exponent + 128);
                    }
                }

                using ( var img = new MagickImage( pixels, new MagickReadSettings
                {
                    Width = width,
                    Height = height,
                    PixelStorage = new PixelStorageSettings( StorageType.Char, "BGRA" )
                } ) )
                {
                    img.Write( Response.OutputStream, MagickFormat.Png );
                }

                Response.OutputStream.Close();
            }
        }
    }
}

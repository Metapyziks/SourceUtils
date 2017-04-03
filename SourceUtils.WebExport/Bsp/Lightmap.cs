using System;
using System.IO;
using ImageMagick;
using MimeTypes;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    [Prefix("/maps/{map}/lightmap.png")]
    class LightmapController : ResourceController
    {
        [Get]
        public void Get( [Url] string map )
        {
            if ( Skip )
            {
                Response.Close();
                return;
            }

            Response.ContentType = MimeTypeMap.GetMimeType(".png");

            var bsp = Program.GetMap( map );

            using (var sampleStream = bsp.GetLumpStream(ValveBspFile.LumpType.LIGHTING_HDR))
            {
                var lightmap = bsp.LightmapLayout;
                var width = lightmap.TextureSize.X;
                var height = lightmap.TextureSize.Y;

                var pixels = new byte[width * height * 4];

                var sampleBuffer = new LightmapSample[256 * 256];

                for (int i = 0, iEnd = bsp.FacesHdr.Length; i < iEnd; ++i)
                {
                    var face = bsp.FacesHdr[i];
                    if (face.LightOffset == -1) continue;

                    var rect = lightmap.GetLightmapRegion(i);
                    var sampleCount = rect.Width * rect.Height;

                    sampleStream.Seek(face.LightOffset, SeekOrigin.Begin);

                    LumpReader<LightmapSample>.ReadLumpFromStream(sampleStream, sampleCount, sampleBuffer);

                    for (var y = -1; y < rect.Height + 1; ++y)
                        for (var x = -1; x < rect.Width + 1; ++x)
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

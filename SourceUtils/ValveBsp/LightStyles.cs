using System;
using System.Collections.Generic;
using System.IO;
using SourceUtils.ValveBsp;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        /// <summary>
        /// Marks an unused light style slot on a face.
        /// </summary>
        public const byte NoLightStyle = 255;

        /// <summary>
        /// VRAD gives each group of named lights its own style from here on, so they can be
        /// switched at runtime. Styles below this are the built-in animated patterns.
        /// </summary>
        private const int FirstSwitchableLightStyle = 32;

        private const int MaxLightStylesPerFace = 4;

        /// <summary>
        /// Bumped faces store a flat lightmap followed by one for each of the three bump basis
        /// directions, for every style.
        /// </summary>
        private const int BumpLightmapPages = 4;

        private const int SpawnFlagInitiallyDark = 1;

        private static readonly ColorRGBExp32 Fullbright = new ColorRGBExp32( 255, 255, 255, 0 );

        private HashSet<int> _initiallyDarkLightStyles;

        /// <summary>
        /// Whether the given light style is lit when the map starts. Switchable styles are lit
        /// unless every light using them is flagged to start dark.
        /// </summary>
        public bool IsLightStyleOnByDefault( byte style )
        {
            if ( style == NoLightStyle ) return false;
            if ( style < FirstSwitchableLightStyle ) return true;

            return !GetInitiallyDarkLightStyles().Contains( style );
        }

        private HashSet<int> GetInitiallyDarkLightStyles()
        {
            lock ( this )
            {
                if ( _initiallyDarkLightStyles != null ) return _initiallyDarkLightStyles;

                var dark = new HashSet<int>();
                var lit = new HashSet<int>();

                foreach ( var entity in Entities )
                {
                    if ( entity.ClassName == null || !entity.ClassName.StartsWith( "light" ) ) continue;

                    int style = entity["style"];
                    if ( style < FirstSwitchableLightStyle ) continue;

                    int spawnFlags = entity["spawnflags"];
                    (( spawnFlags & SpawnFlagInitiallyDark ) != 0 ? dark : lit).Add( style );
                }

                dark.ExceptWith( lit );

                return _initiallyDarkLightStyles = dark;
            }
        }

        /// <summary>
        /// Reads the flat lightmap of a face into <paramref name="output"/>, adding together
        /// every light style that is lit when the map starts.
        /// </summary>
        /// <param name="lighting">Stream of the lighting lump that matches <paramref name="face"/>.</param>
        public void ReadLightmapSamples( Stream lighting, Face face, ColorRGBExp32[] output )
        {
            var size = face.LightMapSize;
            var sampleCount = size.X * size.Y;

            // Maps compiled without VRAD have no lighting at all, and the engine draws them
            // fully lit.
            if ( lighting.Length == 0 )
            {
                for ( var i = 0; i < sampleCount; ++i ) output[i] = Fullbright;
                return;
            }

            var bumped = (TextureInfos[face.TexInfo].Flags & SurfFlags.BUMPLIGHT) != 0;
            var styleStride = sampleCount * (bumped ? BumpLightmapPages : 1);

            var litStyles = new List<int>( MaxLightStylesPerFace );

            for ( var i = 0; i < MaxLightStylesPerFace; ++i )
            {
                var style = face.GetLightStyle( i );
                if ( style == NoLightStyle ) break;
                if ( !IsLightStyleOnByDefault( style ) ) continue;

                // Maps compiled without VRAD list style 0 in every slot with no lighting behind it.
                var pageEnd = face.LightOffset + ((long) i * styleStride + sampleCount) * 4;
                if ( pageEnd > lighting.Length ) continue;

                litStyles.Add( i );
            }

            if ( litStyles.Count == 0 )
            {
                Array.Clear( output, 0, sampleCount );
                return;
            }

            // A single style is copied as-is, so maps without named lights export unchanged.
            if ( litStyles.Count == 1 )
            {
                ReadLightmapPage( lighting, face, litStyles[0] * styleStride, sampleCount, output );
                return;
            }

            var sum = new float[sampleCount * 3];
            var page = new ColorRGBExp32[sampleCount];

            foreach ( var styleIndex in litStyles )
            {
                ReadLightmapPage( lighting, face, styleIndex * styleStride, sampleCount, page );

                for ( var i = 0; i < sampleCount; ++i )
                {
                    var sample = page[i];
                    var scale = (float) Math.Pow( 2, sample.Exponent );

                    sum[i * 3 + 0] += sample.R * scale;
                    sum[i * 3 + 1] += sample.G * scale;
                    sum[i * 3 + 2] += sample.B * scale;
                }
            }

            for ( var i = 0; i < sampleCount; ++i )
            {
                output[i] = EncodeRGBExp32( sum[i * 3 + 0], sum[i * 3 + 1], sum[i * 3 + 2] );
            }
        }

        private static void ReadLightmapPage( Stream lighting, Face face, int sampleOffset, int sampleCount, ColorRGBExp32[] output )
        {
            lighting.Seek( face.LightOffset + (long) sampleOffset * 4, SeekOrigin.Begin );
            LumpReader<ColorRGBExp32>.ReadLumpFromStream( lighting, sampleCount, output );
        }

        /// <summary>
        /// Picks the exponent that keeps the brightest channel in the top half of a byte, the
        /// same precision VRAD writes with.
        /// </summary>
        private static ColorRGBExp32 EncodeRGBExp32( float r, float g, float b )
        {
            var max = Math.Max( r, Math.Max( g, b ) );
            if ( max <= 0f ) return default( ColorRGBExp32 );

            var exponent = (int) Math.Floor( Math.Log( max, 2 ) ) - 7;
            exponent = Math.Max( sbyte.MinValue, Math.Min( sbyte.MaxValue, exponent ) );

            var scale = (float) Math.Pow( 2, -exponent );

            return new ColorRGBExp32( ToChannel( r * scale ), ToChannel( g * scale ), ToChannel( b * scale ), (sbyte) exponent );
        }

        private static byte ToChannel( float value )
        {
            return (byte) Math.Max( 0, Math.Min( 255, (int) Math.Round( value ) ) );
        }
    }
}

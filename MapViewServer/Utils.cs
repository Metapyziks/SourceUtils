using System.Text.RegularExpressions;
using System.Linq;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;

namespace MapViewServer
{
    public static class Utils
    {
        private static readonly Regex _sRepeatedSepRegex = new Regex("//+", RegexOptions.Compiled);
        
        public static string JoinUrl(params string[] parts)
        {
            return _sRepeatedSepRegex.Replace(string.Join("/", parts.Where(x => x.Length > 0)), "/");
        }

        public static JToken ToJson( this IntVector2 vector )
        {
            return new JObject
            {
                { "x", vector.X },
                { "y", vector.Y }
            };
        }

        public static JToken ToJson( this Vector3 vector )
        {
            return new JObject
            {
                { "x", vector.X },
                { "y", vector.Y },
                { "z", vector.Z }
            };
        }

        public static JToken ToJson( this Vector3S vector )
        {
            return new JObject
            {
                { "x", vector.X },
                { "y", vector.Y },
                { "z", vector.Z }
            };
        }

        public static JToken ToJson( this Plane plane )
        {
            return new JObject
            {
                { "normal", plane.Normal.ToJson() },
                { "dist", plane.Dist }
            };
        }

        public static JToken ToJson( this IntRect rect )
        {
            return new JObject
            {
                { "x", rect.X },
                { "y", rect.Y },
                { "width", rect.Width },
                { "height", rect.Height }
            };
        }
    }
}

using System.Text.RegularExpressions;
using System.Linq;

namespace MapViewServer
{
    public static class Utils
    {
        private static readonly Regex _sRepeatedSepRegex = new Regex("//+", RegexOptions.Compiled);
        
        public static string JoinUrl(params string[] parts)
        {
            return _sRepeatedSepRegex.Replace(string.Join("/", parts.Where(x => x.Length > 0)), "/");
        }
    }
}

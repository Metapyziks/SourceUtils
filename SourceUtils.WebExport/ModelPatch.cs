using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using CommandLine;

namespace SourceUtils.WebExport
{
    enum ReplacementType
    {
        Name,
        Directory
    }

    struct ReplacementCommand
    {
        private static readonly Regex _sCommandRegex = new Regex(@"^\s*(?<type>n(ame)?|d(ir(ectory)?)?)\s*\[\s*(?<index>[0-9]+|\*)\s*\]\s*(?<operator>\+?[=:])\s*(?<value>.+)\s*$", RegexOptions.IgnoreCase);
        private static readonly Regex _sReplaceRegex = new Regex(@"\$\{\s*(?<name>[a-zA-Z0-9_-]+)\s*\}");

        public static bool TryParse(string value, out ReplacementCommand cmd)
        {
            cmd = default(ReplacementCommand);

            var match = _sCommandRegex.Match(value);
            if (!match.Success) return false;

            var type = match.Groups["type"].Value[0] == 'n'
                ? ReplacementType.Name
                : ReplacementType.Directory;

            var index = match.Groups["index"].Value == "*" ? -1 : int.Parse(match.Groups["index"].Value);

            cmd = new ReplacementCommand(type, index, match.Groups["value"].Value);

            return true;
        }

        public readonly ReplacementType Type;
        public readonly int Index;
        public readonly string Value;

        public bool Wildcard => Index == -1;

        public ReplacementCommand(ReplacementType type, int index, string value)
        {
            Type = type;
            Index = index;
            Value = value;
        }

        public string GetFormattedValue(int index, string original)
        {
            return _sReplaceRegex.Replace(Value, match =>
            {
                var name = match.Groups["name"].Value;

                switch (name.ToLower())
                {
                    case "index":
                        return index.ToString();
                    case "dir":
                        return Path.GetDirectoryName(original);
                    case "name":
                        return Path.GetFileName(original);
                    case "path":
                        return original;
                    default:
                        return "";
                }
            });
        }
    }

    [Verb("model-patch", HelpText = "Replace one or more textures in a Studio Model.")]
    class ModelPatchOptions : BaseOptions
    {
        [Option('i', "input", HelpText = "Input model path.", Required = true)]
        public string InputPath { get; set; }

        [Option('o', "output", HelpText = "Output path to write to.")]
        public string OutputPath { get; set; }

        [Option('r', "replace", Separator = ';', HelpText = "Replacement commands.")]
        public IEnumerable<string> Replace { get; set; }

        [Option('f', "flags", HelpText = "Replacement Studio Model flags.")]
        public string Flags { get; set; }

        [Option('e', "extract", HelpText = "Extract materials used by the model to the given directory.")]
        public string MaterialExtractPath { get; set; }
    }
}

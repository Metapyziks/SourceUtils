using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
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
        private static readonly Regex _sCommandRegex = new Regex(@"^\s*(?<type>n(ame)?|d(ir(ectory)?)?)\s*\[\s*(?<index>[0-9]+)\s*\]\s*[=:]\s*(?<value>.+)\s*$", RegexOptions.IgnoreCase);

        public static bool TryParse(string value, out ReplacementCommand cmd)
        {
            cmd = default(ReplacementCommand);

            var match = _sCommandRegex.Match(value);
            if (!match.Success) return false;

            var type = match.Groups["type"].Value[0] == 'n'
                ? ReplacementType.Name
                : ReplacementType.Directory;

            var index = int.Parse(match.Groups["index"].Value);

            cmd = new ReplacementCommand(type, index, match.Groups["value"].Value);

            return true;
        }

        public readonly ReplacementType Type;
        public readonly int Index;
        public readonly string Value;

        public ReplacementCommand(ReplacementType type, int index, string value)
        {
            Type = type;
            Index = index;
            Value = value;
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
    }
}

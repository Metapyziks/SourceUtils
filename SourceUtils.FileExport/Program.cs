using System;
using CommandLine;

namespace SourceUtils.FileExport
{
    class Program
    {
        class Options
        {
            [Option( 'g', "gamedir", HelpText = "Game directory to export from.", Required = true )]
            public string GameDir { get; set; }

            [Option( 'v', "verbose", HelpText = "Write every action to standard output." )]
            public bool Verbose { get; set; }

            [Option( "untextured", HelpText = "Only export a single colour for each texture." )]
            public bool Untextured { get; set; }

            [Option('o', "outdir", HelpText = "Output directory.", Required = true)]
            public string OutDir { get; set; }

            [Option('m', "maps", HelpText = "Specific semi-colon separated map names to export (e.g. 'de_dust2;de_mirage').", Required = true)]
            public string Maps { get; set; }
        }

        static int Main( Options args )
        {
            var maps = args.Maps.Split( new [] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries );

            foreach ( var map in maps )
            {
                
            }

            return 0;
        }

        static int Main(string[] args)
        {
            var result = Parser.Default.ParseArguments<Options>( args );
            return result.MapResult( Main, _ => 1 );
        }
    }
}

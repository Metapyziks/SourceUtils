using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SourceUtils.Test
{
    [TestClass]
    public class KeyValsTest
    {
        [TestMethod]
        public void MultiRoot1()
        {
            const string src = @"
                {
                    ""classname"" ""func_target""
                    ""origin"" ""0 1 2""
                }
                {
                    ""classname"" ""info_player_start""
                    ""origin"" ""7 -3.2 8""
                }
                ";

            var keyVals = KeyValues.ParseList( src );

            foreach ( var keyVal in keyVals )
            {
                Console.WriteLine( (string) keyVal["classname"] );
            }
        }
        
        [TestMethod]
        public void MultiRoot2()
        {
            var keyVals = KeyValues.ParseList( Properties.Resources.entities );

            foreach ( var keyVal in keyVals )
            {
                Console.WriteLine( (string) keyVal["classname"] );
            }
        }
    }
}

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Serilog;

namespace ShootTheMoon.Bot.Utils
{

    public sealed class NameGenerator
    {

        private string[] adjectives;
        private string[] firstNames;

        private Random rand;

        private NameGenerator() {
            // Read The Adjectives
            string path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @"english-adjectives.txt");
            adjectives = File.ReadAllLines(path);
            Log.Debug("loaded {0} adjectives", adjectives.Length);

            // Read The First Names
            path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @"first-names.txt");
            firstNames = File.ReadAllLines(path);
            Log.Debug("loaded {0} first names", firstNames.Length);

            rand = new Random();
        }

        private static string CapitalizeFirst(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            return char.ToUpper(input[0]) + input.Substring(1);
        }

        public static string NewName() {
            int random_adjective = Instance.rand.Next(Instance.adjectives.Length);
            int random_firstName = Instance.rand.Next(Instance.firstNames.Length);
            string name = String.Format("{0} {1}", CapitalizeFirst(Instance.adjectives[random_adjective]), CapitalizeFirst(Instance.firstNames[random_firstName]));
            return name;
        }

        private static NameGenerator Instance { get { return Nested.instance; } }

        private class Nested
        {
            // Explicit static constructor to tell C# compiler
            // not to mark type as beforefieldinit
            static Nested()
            {
            }

            internal static readonly NameGenerator instance = new NameGenerator();
        }
    }

}
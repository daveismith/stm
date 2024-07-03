using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace ShootTheMoon.Utils
{

    public sealed class IdGenerator
    {

        private string[] adjectives;
        private string[] nouns;

        private Random rand;

        private IdGenerator() {
            // Read The Adjectives
            string path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @"english-adjectives.txt");
            adjectives = File.ReadAllLines(path);
            Console.Out.WriteLine("loaded {0} adjectives", adjectives.Length);

            // Read The Nouns
            path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @"english-nouns.txt");
            nouns = File.ReadAllLines(path);
            Console.Out.WriteLine("loaded {0} nouns", nouns.Length);

            rand = new Random();
        }

        public static string NewId() {
            int random_adjective = Instance.rand.Next(Instance.adjectives.Length);
            int random_noun = Instance.rand.Next(Instance.nouns.Length);
            string name = String.Format("{0}_{1}", Instance.adjectives[random_adjective], Instance.nouns[random_noun]);
            return name;
        }

        private static IdGenerator Instance { get { return Nested.instance; } }

        private class Nested
        {
            // Explicit static constructor to tell C# compiler
            // not to mark type as beforefieldinit
            static Nested()
            {
            }

            internal static readonly IdGenerator instance = new IdGenerator();
        }
    }

}
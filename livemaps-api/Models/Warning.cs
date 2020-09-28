using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class Warning
    {
        public string title { get; set; }
        public string description { get; set; }
        public Position position { get; set; }
        public string url { get; set; }
        public double[][] polygon { get; internal set; }
    }
}

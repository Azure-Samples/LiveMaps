using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models.Atlas
{
    public partial class Geometry
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("coordinates")]
        public double[][][] Coordinates { get; set; }
    }
}

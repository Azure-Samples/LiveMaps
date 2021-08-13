using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Ssir.Api.Models.Atlas
{
    public partial class Geometry
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("coordinates")]
        public double[][][] Coordinates { get; set; }
    }
}

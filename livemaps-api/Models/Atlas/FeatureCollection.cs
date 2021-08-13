using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Ssir.Api.Models.Atlas
{
    public class FeatureCollection
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("features")]
        public Feature[] Features { get; set; }

        [JsonPropertyName("numberReturned")]
        public long NumberReturned { get; set; }

        public link[] links { get; set; }
    }

    public class link
    {
        public string href { get; set; }
        public string rel { get; set; }
    }
}

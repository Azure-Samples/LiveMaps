using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models.Atlas
{
    public class FeatureCollection
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("features")]
        public Feature[] Features { get; set; }

        [JsonProperty("numberReturned")]
        public long NumberReturned { get; set; }

        public link[] links { get; set; }
    }

    public class link
    {
        public string href { get; set; }
        public string rel { get; set; }
    }
}

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models.Atlas
{
    public partial class Properties
    {
        [JsonProperty("originalId")]
        public Guid OriginalId { get; set; }

        [JsonProperty("categoryId")]
        public string CategoryId { get; set; }

        [JsonProperty("isOpenArea")]
        public bool IsOpenArea { get; set; }

        [JsonProperty("navigableBy")]
        public string[] NavigableBy { get; set; }

        [JsonProperty("routeThroughBehavior")]
        public string RouteThroughBehavior { get; set; }

        [JsonProperty("levelId")]
        public string LevelId { get; set; }

        [JsonProperty("occupants")]
        public object[] Occupants { get; set; }

        [JsonProperty("addressId")]
        public string AddressId { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }
    }
}

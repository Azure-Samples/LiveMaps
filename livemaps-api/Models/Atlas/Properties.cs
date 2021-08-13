using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Ssir.Api.Models.Atlas
{
    public partial class Properties
    {
        [JsonPropertyName("originalId")]
        public Guid OriginalId { get; set; }

        [JsonPropertyName("categoryId")]
        public string CategoryId { get; set; }

        [JsonPropertyName("isOpenArea")]
        public bool IsOpenArea { get; set; }

        [JsonPropertyName("navigableBy")]
        public string[] NavigableBy { get; set; }

        [JsonPropertyName("routeThroughBehavior")]
        public string RouteThroughBehavior { get; set; }

        [JsonPropertyName("levelId")]
        public string LevelId { get; set; }

        [JsonPropertyName("occupants")]
        public object[] Occupants { get; set; }

        [JsonPropertyName("addressId")]
        public string AddressId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }
    }
}

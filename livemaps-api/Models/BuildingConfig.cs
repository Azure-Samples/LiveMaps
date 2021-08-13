using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Ssir.Api.Models
{
    public class BuildingConfig
    {
        [JsonPropertyName("buildingId")]
        public string BuildingId { get; set; }

        [JsonPropertyName("subscriptionKey")]
        public string SubscriptionKey { get; set; }

        [JsonPropertyName("datasetId")]
        public string DatasetId { get; set; }

        [JsonPropertyName("tilesetId")]
        public Guid TilesetId { get; set; }

        [JsonPropertyName("stateSets")]
        public StateSet[] StateSets { get; set; }

        [JsonPropertyName("facilityId")]
        public string FacilityId { get; set; }
    }

    public partial class StateSet
    {
        [JsonPropertyName("stateSetName")]
        public string StateSetName { get; set; }

        [JsonPropertyName("stateSetId")]
        public Guid StateSetId { get; set; }
    }
}

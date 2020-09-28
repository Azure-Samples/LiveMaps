using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class BuildingConfig
    {
        [JsonProperty("buildingId")]
        public string BuildingId { get; set; }

        [JsonProperty("subscriptionKey")]
        public string SubscriptionKey { get; set; }

        [JsonProperty("datasetId")]
        public string DatasetId { get; set; }

        [JsonProperty("tilesetId")]
        public Guid TilesetId { get; set; }

        [JsonProperty("stateSets")]
        public StateSet[] StateSets { get; set; }

        [JsonProperty("facilityId")]
        public string FacilityId { get; set; }
    }

    public partial class StateSet
    {
        [JsonProperty("stateSetName")]
        public string StateSetName { get; set; }

        [JsonProperty("stateSetId")]
        public Guid StateSetId { get; set; }
    }
}

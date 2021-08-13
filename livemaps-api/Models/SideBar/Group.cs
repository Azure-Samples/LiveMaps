using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Ssir.Api.Models.SideBar
{
    public partial class Group
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("items")]
        public LabelItem[] Items { get; set; }
    }
}

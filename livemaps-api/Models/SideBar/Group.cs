using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models.SideBar
{
    public partial class Group
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("items")]
        public LabelItem[] Items { get; set; }
    }
}

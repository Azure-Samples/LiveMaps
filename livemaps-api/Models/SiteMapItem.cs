using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class SiteMapItem
    {
        public SiteMapItem(string name, string id, string type, double area, double latitude, double longitude, string parentId)
        {
            this.name = name;
            this.id = id.Replace(" ", "");
            this.parentId = parentId;
            this.type = type;
            this._area = area;
            this.latitude = latitude;
            this.longitude = longitude;
            this.items = new HashSet<string>();            
        }
        private double _area;
        public string name { get; set; }
        public string id { get; set; }
        public string parentId { get; set; }
        public string type { get; set; }
        public double latitude { get; set; }
        public double longitude { get; set; }
        public double area {
            get { return Math.Round(_area, 2); }
            set { _area = value; }
        }
        public HashSet<string> items;
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public BuildingConfig config { get; set; }
    }
}

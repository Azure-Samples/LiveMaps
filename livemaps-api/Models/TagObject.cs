using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class TagObject
    {
        public string DeviceId { get; set; }
        public double Value { get; set; }
        public System.DateTime timestamp { get; set; }
        public string MapFeatureId { get; set; }
        public string TagName { get; set; }
    }
}

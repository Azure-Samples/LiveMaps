using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class RoomDataItem
    {  
        public string name { get; set; }
        public string type { get; set; }
        public string unitId { get; set; }
        public double[][] polygon { get; set; }

    }
}

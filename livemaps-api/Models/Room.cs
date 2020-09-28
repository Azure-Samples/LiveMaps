using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class Room
    {        
        public Dictionary<string, Device> Devices = new Dictionary<string, Device>();
    }

    public class Unit
    {
        public Dictionary<string, Device> Devices = new Dictionary<string, Device>();
    }
}

﻿using System;
using System.Collections.Generic;
using System.Text;

namespace Ssir.Api.Models
{
    public class Building
    {
        public Building()
        {            
            Levels = new Dictionary<string, Level>();
        }        
        public Dictionary<string, Level> Levels;
    }
}

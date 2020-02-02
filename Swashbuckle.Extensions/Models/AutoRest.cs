using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Swashbuckle.Extensions.Models
{
    // Disable all XML Comment warnings in this file // 
    #pragma warning disable 1591

    public class PageableExtension
    {
        public string NextLinkName { get; set; }
        public string ItemName { get; set; }
        public string OperationName { get; set; }
    }
}
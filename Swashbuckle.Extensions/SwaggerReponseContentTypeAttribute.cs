using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Swashbuckle.Extensions
{
    /// <summary>
    /// SwaggerReponseContentTypeAttribute
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public sealed class SwaggerReponseContentTypeAttribute : Attribute
    {
        /// <summary>
        /// SwaggerReponseContentTypeAttribute
        /// </summary>
        /// <param name="responseType"></param>
        public SwaggerReponseContentTypeAttribute(string responseType)
        {
            ResponseType = responseType;
        }
        /// <summary>
        /// Response Content Type
        /// </summary>
        public string ResponseType { get; private set; }

        /// <summary>
        /// Remove all other Response Content Types
        /// </summary>
        public bool Exclusive { get; set; }
    }
}

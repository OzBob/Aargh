using Swashbuckle.Extensions.Models;
using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{
    /// <summary>
    /// Swagger Document Vendor Extensions: Header keys
    /// </summary>
    public class ApplyDocumentVendorExtensions : IDocumentFilter
    {
        /// <summary>
        /// Apply Custom Swagger Document extension
        /// </summary>
        /// <param name="swaggerDoc"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiExplorer"></param>
        public void Apply(SwaggerDocument swaggerDoc, SchemaRegistry schemaRegistry, IApiExplorer apiExplorer)
        {
            //swaggerDoc.vendorExtensions.Add("x-api-key", "zzz");
        }
    }
}

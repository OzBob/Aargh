using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace MYOBApiProxy.SwaggerExtensions
{
    /// <summary>
    /// Custom Response Content Operation Filter
    /// </summary>
    public class ResponseContentTypeOperationFilter : IOperationFilter
    {
        /// <summary>
        /// Modify Operation 'Produces' for each <see cref="SwaggerReponseContentTypeAttribute"/>
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiDescription"></param>
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            var requestAttributes = apiDescription.GetControllerAndActionAttributes<SwaggerReponseContentTypeAttribute>().FirstOrDefault();

            if (requestAttributes != null)
            {
                if (requestAttributes.Exclusive)
                    operation.produces.Clear();

                operation.produces.Add(requestAttributes.ResponseType);
            }
        }
    }
}

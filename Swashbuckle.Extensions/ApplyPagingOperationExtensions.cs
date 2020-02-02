using Swashbuckle.Extensions.Models;
using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{

    /// <summary>
    /// 
    /// </summary>
    public class ApplyPagingOperationExtensions : IOperationFilter
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiDescription"></param>
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            var isPageable = apiDescription.ActionDescriptor.GetCustomAttributes<PageableResponseAttribute>().Any();
            if (isPageable)
            {
                operation.vendorExtensions.Add("x-ms-pageable", new PageableExtension { NextLinkName = "next", OperationName = "_links" });
            }
        }
    }
}

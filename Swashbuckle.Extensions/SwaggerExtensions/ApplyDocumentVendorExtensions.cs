using MYOBApiProxy.SwaggerExtensions.Models;
using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace MYOBApiProxy.SwaggerExtensions
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
            //swaggerDoc.vendorExtensions.Add("x-myobapi-key", "9bnx2tngdyjw4mpxusbqx7e7");
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class ApplyPagingOpertaionExtensions : IOperationFilter
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

    /// <summary>
    /// 
    /// </summary>
    public class HandleFromHeaderParams : IOperationFilter
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiDescription"></param>
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            var fromHeaderAttributes = apiDescription.ActionDescriptor.GetParameters()
                .Where(param => param.GetCustomAttributes<FromHeaderAttribute>().Any())
            .ToArray();

            foreach (var headerParam in fromHeaderAttributes)
            {
                var operationParameter = operation.parameters.First(p => p.name == headerParam.ParameterName);

                operationParameter.name = headerParam.ParameterName;
                operationParameter.@in = "header";
                operationParameter.type = "string";
            }

        }
    }
}

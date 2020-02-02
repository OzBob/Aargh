using Swashbuckle.Swagger;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Description;
using System.Web.Http.Filters;
using static Swashbuckle.Extensions.SwaggerImportFileParamType;

namespace Swashbuckle.Extensions
{
    public class ValidateMimeMultipartContentFilter : ActionFilterAttribute
    {
        public ValidateMimeMultipartContentFilter()
        {
        }

        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            if (!actionContext.Request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }
        }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext)
        {
        }
    }

    public class AddFormDataUploadParamTypes<T> : IOperationFilter
    {
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            var actFilters = apiDescription.ActionDescriptor.GetFilterPipeline();
            var supportsDesiredFilter = actFilters.Select(f => f.Instance).OfType<T>().Any();

            if (supportsDesiredFilter)
            {

                if (!operation.consumes.Contains("multipart/form-data"))
                    operation.consumes.Add("multipart/form-data");

                if (!operation.parameters.Any(p => p.type == "file"))
                {
                    operation.parameters = operation.parameters ?? new List<Parameter>();
                    operation.parameters.Add(new Parameter
                    {
                        name = "file",
                        @in = "formData",
                        description = "File to upload.",
                        required = true,
                        type = "file"
                    });
                }
                /*
                var formHeaderAttributes = apiDescription.ActionDescriptor.GetParameters()
                    .Where(param => param.GetType().Equals(typeof(HttpPostedFileBase)));

                foreach (var attr in formHeaderAttributes)
                {

                    var operationParameter = operation.parameters.First(p => p.name == headerParam.ParameterName);

                    operation.parameters = operation.parameters ?? new List<Parameter>();
                    operation.parameters.Add(new Parameter
                        {
                            description = attr.Description,
                            name = attr.Name,
                            @in = "formData",
                            required = true,
                            type = "file",
                        });
                }
                */
            }
        }
    }
}
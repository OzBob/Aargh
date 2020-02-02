using Swashbuckle.Swagger;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{
    public class SwaggerFormAttribute : ParameterBindingAttribute
    {
        public SwaggerFormAttribute(string name, string description)
        {
            Name = name;
            Description = description;
        }
        public string Name { get; private set; }
        public string Description { get; private set; }

        public override HttpParameterBinding GetBinding(HttpParameterDescriptor parameter)
        {
            return new FromHeaderBinding(parameter, this.Name);
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class SwaggerImportFileParamType : IOperationFilter
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiDescription"></param>
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            if (operation.parameters == null) return;

            // if you don't use [Consumes("multipart/form-data")] on your operations, you don't need this
            //if (!operation.consumes.Contains("multipart/form-data")) return;

            //var requestParameters = apiDescription.ParameterDescriptions
            //    .Where(d => d.ParameterDescriptor.ParameterType.FullName.Equals("System.Web.HttpPostedFileBase"));

            //var requestAttributes = apiDescription.
            //    GetControllerAndActionAttributes<SwaggerFormAttribute>();

            var formHeaderAttributes = apiDescription.ActionDescriptor.GetParameters()
                .Where(param => param.GetCustomAttributes<SwaggerFormAttribute>().Any())
                .ToArray();

            foreach (var attr in formHeaderAttributes)
            {
                operation.parameters = operation.parameters ?? new List<Parameter>();

                //operation.parameters.Add(new Parameter
                //{
                //    name = attr.ParameterName,
                //    //name = "file",
                //    @in = "query",
                //    description = "File to upload.",
                //    required = true,
                //    type = "string",
                //});
                operation.parameters.Add(new Parameter
                {
                    name = attr.ParameterName,
                    //name = "file",
                    @in = "formData",
                    description = "File to upload.",
                    required = true,
                    type = "file",
                });
                if (!operation.consumes.Contains("multipart/form-data"))
                    operation.consumes.Add("multipart/form-data");
            }
        }
    }
}
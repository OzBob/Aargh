using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Swashbuckle.Extensions
{
    [AttributeUsage(AttributeTargets.Method, Inherited = false, AllowMultiple = true)]
    public class SwaggerParameterAttribute : Attribute
    {
        public SwaggerParameterAttribute(string name, string description)
        {
            Name = name;
            Description = description;
        }
        public SwaggerParameterAttribute(string name, string parameterType, string datatype, string description, bool required)
        {
            Name = name;
            DataType = datatype;
            ParameterType = parameterType;
            Description = description;
            Required = required;
        }

        public string Name { get; private set; }
        public string DataType { get; set; }
        public string ParameterType { get; set; }
        public string Description { get; private set; }
        public bool Required { get; set; } = false;
    }
}

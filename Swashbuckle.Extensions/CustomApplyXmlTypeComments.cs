namespace Swashbuckle.Extensions
{
    using System;
    using System.Xml.XPath;
    using System.Linq;
    using System.Collections.Generic;
    using System.Text;
    using System.Reflection;
    using Newtonsoft.Json.Serialization;
    using Swashbuckle.Swagger;
    using Swagger.XmlComments;
    
    public class CustomApplyXmlTypeComments : ISchemaFilter
    {
        private const string MemberXPath = "/doc/members/member[@name='{0}']";
        private const string SummaryTag = "summary";

        private readonly XPathNavigator _navigator;
        private bool _ignoreObsoleteProperties;

        public CustomApplyXmlTypeComments(string xmlCommentsPath)
        {
            _navigator = new XPathDocument(xmlCommentsPath).CreateNavigator();
            _ignoreObsoleteProperties = true;
        }

        /// <summary>
        /// old ImodelFilter way
        /// </summary>
        /// <param name="model"></param>
        /// <param name="context"></param>
        private void Apply(Schema model, ModelFilterContext context)
        {
            var commentId = XmlCommentsIdHelper.GetCommentIdForType(context.SystemType);
            var typeNode = _navigator.SelectSingleNode(string.Format(MemberXPath, commentId));

            if (typeNode != null)
            {
                var summaryNode = typeNode.SelectSingleNode(SummaryTag);
                if (summaryNode != null)
                    model.description = summaryNode.ExtractContent();
            }

            foreach (var entry in model.properties)
            {
                var jsonProperty = context.JsonObjectContract.Properties[entry.Key];
                if (jsonProperty == null) continue;

                ApplyPropertyComments(entry.Value, jsonProperty.PropertyInfo());
            }
        }

        /// <summary>
        /// new way
        /// </summary>
        /// <param name="model"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="type"></param>
        public void Apply(Schema model, SchemaRegistry schemaRegistry, Type type)
        {
            var commentId = XmlCommentsIdHelper.GetCommentIdForType(type);
            var typeNode = _navigator.SelectSingleNode(string.Format(MemberXPath, commentId));

            if (typeNode != null)
            {
                var summaryNode = typeNode.SelectSingleNode(SummaryTag);
                if (summaryNode != null)
                    model.description = summaryNode.ExtractContent();
            }
            //var _contractResolver = schemaRegistry.jsonSerializerSettings.ContractResolver ?? new DefaultContractResolver();
            foreach (var entry in model.properties)
            {
                continue;//TODO figure out how to get 'context' from model
                //var jsonProperty = context.JsonObjectContract.Properties[entry.Key];
                //if (jsonProperty == null) continue;

                //ApplyPropertyComments(entry.Value, jsonProperty.PropertyInfo());
            }
        }

        private Schema CreateObjectSchema(JsonObjectContract jsonContract)
        {
            var properties = jsonContract.Properties
                .Where(p => !p.Ignored)
                .Where(p => !(_ignoreObsoleteProperties && p.IsObsolete()))
                .ToDictionary(
                    prop => prop.PropertyName,
                    prop => CreateInlineSchema(prop.PropertyType).WithValidationProperties(prop)
                );

            var required = jsonContract.Properties.Where(prop => prop.IsRequired())
                .Select(propInfo => propInfo.PropertyName)
                .ToList();

            var schema = new Schema
            {
                required = required.Any() ? required : null, // required can be null but not empty
                properties = properties,
                type = "object"
            };

            //foreach (var filter in _schemaFilters)
            //{
            //    filter.Apply(schema, this, jsonContract.UnderlyingType);
            //}

            //// NOTE: In next major version, _modelFilters will completely replace _schemaFilters
            //var modelFilterContext = new ModelFilterContext(jsonContract.UnderlyingType, jsonContract, this);
            //foreach (var filter in _modelFilters)
            //{
            //    filter.Apply(schema, modelFilterContext);
            //}

            return schema;
        }
        private Schema CreateInlineSchema(Type type)
        {
            //if (_customSchemaMappings.ContainsKey(type))
            //    return _customSchemaMappings[type]();

            //var jsonContract = _contractResolver.ResolveContract(type);

            //if (jsonContract is JsonPrimitiveContract)
            //    return CreatePrimitiveSchema((JsonPrimitiveContract)jsonContract);

            //var dictionaryContract = jsonContract as JsonDictionaryContract;
            //if (dictionaryContract != null)
            //    return dictionaryContract.IsSelfReferencing()
            //        ? CreateRefSchema(type)
            //        : CreateDictionarySchema(dictionaryContract);

            //var arrayContract = jsonContract as JsonArrayContract;
            //if (arrayContract != null)
            //    return arrayContract.IsSelfReferencing()
            //        ? CreateRefSchema(type)
            //        : CreateArraySchema(arrayContract);

            //var objectContract = jsonContract as JsonObjectContract;
            //if (objectContract != null && !objectContract.IsAmbiguous())
            //    return CreateRefSchema(type);

            // Fallback to abstract "object"
            return new Schema { type = "object" };
        }
        private void ApplyPropertyComments(Schema propertySchema, PropertyInfo propertyInfo)
        {
            if (propertyInfo == null) return;

            var commentId = XmlCommentsIdHelper.GetCommentIdForProperty(propertyInfo);
            var propertyNode = _navigator.SelectSingleNode(string.Format(MemberXPath, commentId));
            if (propertyNode == null) return;

            var propSummaryNode = propertyNode.SelectSingleNode(SummaryTag);
            if (propSummaryNode != null)
            {
                propertySchema.description = propSummaryNode.ExtractContent();
            }
        }
    }
}
import { comment, tsReadonly } from "../utils.js";
import { transformOperationObj } from "./operation.js";
import { transformParametersArray } from "./parameters.js";
export function transformPathsObj(paths, options) {
    const { globalParameters, operations, ...ctx } = options;
    const readonly = tsReadonly(ctx.immutableTypes);
    let output = "";
    for (const [url, pathItem] of Object.entries(paths)) {
        if (pathItem.description)
            output += comment(pathItem.description);
        if (pathItem.$ref) {
            output += `  ${readonly}"${url}": ${pathItem.$ref};\n`;
            continue;
        }
        output += ` ${readonly}"${url}": {\n`;
        for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"]) {
            const operation = pathItem[method];
            if (!operation)
                continue;
            if (operation.description)
                output += comment(operation.description);
            if (operation.operationId) {
                operations[operation.operationId] = { operation, pathItem };
                const namespace = ctx.namespace ? `external["${ctx.namespace}"]["operations"]` : `operations`;
                output += `    ${readonly}"${method}": ${namespace}["${operation.operationId}"];\n`;
            }
            else {
                output += `    ${readonly}"${method}": {\n      ${transformOperationObj(operation, {
                    ...ctx,
                    globalParameters,
                    pathItem,
                })}\n    }\n`;
            }
        }
        if (pathItem.parameters) {
            output += `   ${readonly}parameters: {\n      ${transformParametersArray(pathItem.parameters, {
                ...ctx,
                globalParameters,
            })}\n    }\n`;
        }
        output += `  }\n`;
    }
    return output;
}
//# sourceMappingURL=paths.js.map
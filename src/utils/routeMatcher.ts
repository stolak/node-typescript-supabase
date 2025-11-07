type RouteDefinition = {
  description: string;
  route: string;
};

type RoutesJson = Record<string, RouteDefinition[]>;

/**
 * Checks whether a given URL matches any route defined in the routesJson structure.
 * It supports dynamic path segments expressed as `{param}` in the route definitions.
 *
 * @param originalUrl - The URL to match (e.g. `/api/v1/brands/123`). Query strings are ignored.
 * @param routesJson - A dictionary of route definitions keyed by resource name.
 */
export function routeExists(
  originalUrl: string,
  routesJson: RoutesJson
): boolean {
  if (!originalUrl) return false;

  const [urlPath] = originalUrl.split("?");

  for (const key of Object.keys(routesJson)) {
    for (const routeObj of routesJson[key] ?? []) {
      const [methodOrPath, maybePath] = routeObj.route.trim().split(/\s+/, 2);

      // Handle definitions both with and without HTTP verb prefixes.
      const path = maybePath ?? methodOrPath;

      const regexPath = path.replace(/\{[^/]+\}/g, "[^/]+");
      const regex = new RegExp(`^${regexPath}$`);

      if (regex.test(urlPath)) {
        return true;
      }
    }
  }

  return false;
}

export default routeExists;

type UserPrivilege = {
  description: string;
  status: boolean;
};

type PrivilegesOutput = Record<
  string,
  { description: string; status: boolean }[]
>;

/**
 * Generates a privilege status mapping by resource group using route metadata
 * and a list of user privilege flags.
 *
 * @param routesJson - Route metadata grouped by resource name.
 * @param userPrivileges - Flat list of privilege descriptions with status flags.
 */
export function generatePrivileges(
  routesJson: RoutesJson,
  userPrivileges: UserPrivilege[]
): PrivilegesOutput {
  const privilegesMap = new Map<string, boolean>();

  for (const privilege of userPrivileges) {
    privilegesMap.set(privilege.description, privilege.status);
  }

  const output: PrivilegesOutput = {};

  for (const [group, routes] of Object.entries(routesJson)) {
    output[group] = (routes ?? []).map((route) => ({
      description: route.description,
      status: privilegesMap.get(route.description) ?? false,
    }));
  }

  return output;
}

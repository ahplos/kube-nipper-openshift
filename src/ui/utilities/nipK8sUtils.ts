import {
    K8sResourceKind,
    useK8sWatchResource,
    WatchK8sResource
} from '@openshift-console/dynamic-plugin-sdk';

import {
    RESOURCE_NIP_GVK,
    ResourceNip
} from './objectDefs'

export class InvalidK8sSingleResourceQueryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidK8sSingleResourceQueryError';
    }
}

export default class NipK8sUtils {

    private static getK8sResource<T extends K8sResourceKind> (options: WatchK8sResource = {}):
        [T, boolean, string]
    {
        let [results, loaded, errorMsg] = useK8sWatchResource<T>(options);

        return [results as T, loaded, errorMsg];
    }

    private static getK8sResources<T extends K8sResourceKind[]> (options: WatchK8sResource = {}):
         [T, boolean, string]
    {
        let [results, loaded, errorMsg] = useK8sWatchResource<T>(options);

        return [results, loaded, errorMsg];
    }

    public static getResourceNip (options: WatchK8sResource = {}):
        [ResourceNip, boolean, string]
    {
        options.groupVersionKind = RESOURCE_NIP_GVK;
        return NipK8sUtils.getK8sResource(options);
    }

    public static getResourceNips (options: WatchK8sResource = {}):
        [ResourceNip[], boolean, string]
    {
        options.groupVersionKind = RESOURCE_NIP_GVK;
        options.isList = true;
        return NipK8sUtils.getK8sResources<ResourceNip[]>(options);
    }
}

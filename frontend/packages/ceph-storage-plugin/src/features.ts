import * as _ from 'lodash';
import { Dispatch } from 'react-redux';
import { k8sList, StorageClassResourceKind, ListKind } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { setFlag } from '@console/internal/actions/features';
import { FeatureDetector } from '@console/plugin-sdk';
import { getAnnotations, getName } from '@console/shared/src/selectors/common';
import { fetchK8s } from '@console/internal/graphql/client';
import { StorageClassModel } from '@console/internal/models';
import { OCSServiceModel } from './models';
import {
  CEPH_STORAGE_NAMESPACE,
  OCS_SUPPORT_ANNOTATION,
  RGW_PROVISIONER,
  SECOND,
  OCS_OPERATOR,
  NOOBAA_PROVISIONER,
} from './constants';
import { StorageClusterKind } from './types';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';
export const OCS_CONVERGED_FLAG = 'OCS_CONVERGED';
export const NOOBAA_FLAG = 'NOOBAA';

// Used to activate NooBaa dashboard
export const OCS_FLAG = 'OCS';
// Todo(bipuladh): Remove this completely in 4.6
export const CEPH_FLAG = 'CEPH';

export const LSO_FLAG = 'LSO';

export const RGW_FLAG = 'RGW';

export enum GUARDED_FEATURES {
  // Flag names to be prefixed with "OCS_" so as to seperate from console flags
  OCS_MULTUS = 'OCS_MULTUS',
  OCS_ARBITER = 'OCS_ARBITER',
  OCS_KMS = 'OCS_KMS',
  OCS_FLEXIBLE_SCALING = 'OCS_FLEXIBLE_SCALING',
  OCS_TAINT_NODES = 'OCS_TAINT_NODES',
  OCS_THICK_PROVISION = 'OCS_THICK_PROVISION',
}

const OCS_FEATURE_FLAGS = {
  // [flag name]: <value of flag in csv annotation>
  [GUARDED_FEATURES.OCS_MULTUS]: 'multus',
  [GUARDED_FEATURES.OCS_ARBITER]: 'arbiter',
  [GUARDED_FEATURES.OCS_KMS]: 'kms',
  [GUARDED_FEATURES.OCS_FLEXIBLE_SCALING]: 'flexible-scaling',
  [GUARDED_FEATURES.OCS_TAINT_NODES]: 'taint-nodes',
  [GUARDED_FEATURES.OCS_THICK_PROVISION]: 'thick-provision',
};

const handleError = (res: any, flags: string[], dispatch: Dispatch, cb: FeatureDetector) => {
  if (res?.response instanceof Response) {
    const status = res?.response?.status;
    if (_.includes([403, 502], status)) {
      flags.forEach((feature) => {
        dispatch(setFlag(feature, undefined));
      });
    }
    if (!_.includes([401, 403, 500], status)) {
      setTimeout(() => cb(dispatch), 15000);
    }
  } else {
    flags.forEach((feature) => {
      dispatch(setFlag(feature, undefined));
    });
  }
};

// To be Run only once the Storage Cluster is Installed
// RGW storageClass should init. first => Noobaa consumes RGW to create a backingStore
// Stops polling when either the RGW storageClass or the Noobaa Storage Class comes up
export const detectRGW: FeatureDetector = async (dispatch) => {
  let id = null;
  let isInitial = true;
  const logicHandler = () =>
    k8sList(StorageClassModel)
      .then((data: StorageClassResourceKind[]) => {
        const isRGWPresent = data.some((sc) => sc.provisioner === RGW_PROVISIONER);
        const isNooBaaPresent = data.some((sc) => sc.provisioner === NOOBAA_PROVISIONER);
        if (isRGWPresent) {
          dispatch(setFlag(RGW_FLAG, true));
          clearInterval(id);
        } else {
          if (isInitial === true) {
            dispatch(setFlag(RGW_FLAG, false));
            isInitial = false;
          }
          // If Noobaa already has come up; Platform doesn't support RGW; stop polling
          if (isNooBaaPresent) {
            clearInterval(id);
          }
        }
      })
      .catch((error) => {
        if (error?.response instanceof Response) {
          const status = error?.response?.status;
          if (_.includes([403, 502], status)) {
            dispatch(setFlag(RGW_FLAG, false));
            clearInterval(id);
          }
          if (!_.includes([401, 403, 500], status) && isInitial === true) {
            dispatch(setFlag(RGW_FLAG, false));
            isInitial = false;
          }
        } else {
          clearInterval(id);
        }
      });
  id = setInterval(logicHandler, 15 * SECOND);
};

export const detectOCS: FeatureDetector = async (dispatch) => {
  try {
    const storageClusters = await k8sList(OCSServiceModel, { ns: CEPH_STORAGE_NAMESPACE });
    if (storageClusters?.length > 0) {
      const storageCluster = storageClusters.find(
        (sc: StorageClusterKind) => sc.status.phase !== 'Ignored',
      );
      const isInternal = _.isEmpty(storageCluster?.spec?.externalStorage);
      dispatch(setFlag(OCS_FLAG, true));
      dispatch(setFlag(OCS_CONVERGED_FLAG, isInternal));
      dispatch(setFlag(OCS_INDEPENDENT_FLAG, !isInternal));
    }
  } catch (error) {
    dispatch(setFlag(OCS_CONVERGED_FLAG, false));
    dispatch(setFlag(OCS_INDEPENDENT_FLAG, false));
    dispatch(setFlag(OCS_FLAG, false));
  }
};

const detectFeatures = (dispatch, csv: ClusterServiceVersionKind) => {
  const support = JSON.parse(getAnnotations(csv)?.[OCS_SUPPORT_ANNOTATION]);
  _.keys(OCS_FEATURE_FLAGS).forEach((feature) => {
    dispatch(setFlag(feature, support.includes(OCS_FEATURE_FLAGS[feature])));
  });
};

export const detectOCSSupportedFeatures: FeatureDetector = async (dispatch) => {
  try {
    const csvList = await fetchK8s<ListKind<ClusterServiceVersionKind>>(
      ClusterServiceVersionModel,
      '',
      CEPH_STORAGE_NAMESPACE,
    );
    const ocsCSV = csvList.items.find((obj) => _.startsWith(getName(obj), OCS_OPERATOR));
    if (ocsCSV) {
      detectFeatures(dispatch, ocsCSV);
    } else {
      // If OCS CSV is not present then poll
      setTimeout(() => detectOCSSupportedFeatures(dispatch), 15 * SECOND);
    }
  } catch (error) {
    handleError(error, _.keys(OCS_FEATURE_FLAGS), dispatch, detectOCSSupportedFeatures);
  }
};

import {useEffect, useState} from 'react';
import {detectWebGLSupport} from '~/lib/three/webgl';

export function useWebGLSupport() {
  const [state, setState] = useState({checked: false, supported: false});

  useEffect(() => {
    setState({checked: true, supported: detectWebGLSupport()});
  }, []);

  return state;
}

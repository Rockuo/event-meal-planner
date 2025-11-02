import { createContext} from 'react'

const GlobalLoader = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
}>({
    loading: true,
    setLoading: (loading: boolean) => undefined
})

export default GlobalLoader;
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Cookies from 'js-cookie'

const httpLink = new HttpLink({ uri: '/api/graphql' })

const authLink = setContext((_, { headers }) => {
    const token = Cookies.get('token')

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    }
})

export const client = new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
})

